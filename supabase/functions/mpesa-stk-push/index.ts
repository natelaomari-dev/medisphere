import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, ...payload } = await req.json();

    if (action === "initiate") {
      // M-Pesa STK Push initiation
      const { phone_number, amount, invoice_id, patient_id, hospital_id, account_reference } = payload;

      if (!phone_number || !amount || !patient_id || !hospital_id) {
        return new Response(JSON.stringify({ error: "Missing required fields: phone_number, amount, patient_id, hospital_id" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Format phone number to 254 format
      let formattedPhone = phone_number.replace(/\s+/g, "").replace(/^0/, "254").replace(/^\+/, "");
      if (!formattedPhone.startsWith("254")) formattedPhone = "254" + formattedPhone;

      // Get M-Pesa credentials from secrets
      const consumerKey = Deno.env.get("MPESA_CONSUMER_KEY");
      const consumerSecret = Deno.env.get("MPESA_CONSUMER_SECRET");
      const shortcode = Deno.env.get("MPESA_SHORTCODE") || "174379";
      const passkey = Deno.env.get("MPESA_PASSKEY");
      const callbackUrl = Deno.env.get("MPESA_CALLBACK_URL") || `${supabaseUrl}/functions/v1/mpesa-stk-push`;

      // If M-Pesa credentials are not set, create a pending payment record (demo mode)
      if (!consumerKey || !consumerSecret || !passkey) {
        const demoCheckoutId = `demo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        
        const { data: payment, error: paymentError } = await supabase
          .from("payments")
          .insert({
            hospital_id,
            patient_id,
            invoice_id: invoice_id || null,
            amount,
            payment_method: "mpesa",
            payment_status: "pending",
            phone_number: formattedPhone,
            mpesa_checkout_request_id: demoCheckoutId,
            transaction_reference: account_reference || "HMS-Payment",
          })
          .select()
          .single();

        if (paymentError) throw paymentError;

        return new Response(JSON.stringify({
          success: true,
          demo_mode: true,
          message: "M-Pesa STK Push simulated (demo mode). Configure MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, and MPESA_PASSKEY for live payments.",
          checkout_request_id: demoCheckoutId,
          payment_id: payment.id,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // === LIVE M-PESA FLOW ===
      // 1. Get OAuth token
      const authString = btoa(`${consumerKey}:${consumerSecret}`);
      const tokenRes = await fetch("https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials", {
        headers: { Authorization: `Basic ${authString}` },
      });
      const tokenData = await tokenRes.json();
      const accessToken = tokenData.access_token;

      // 2. Generate timestamp and password
      const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, "").slice(0, 14);
      const password = btoa(`${shortcode}${passkey}${timestamp}`);

      // 3. STK Push request
      const stkRes = await fetch("https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          BusinessShortCode: shortcode,
          Password: password,
          Timestamp: timestamp,
          TransactionType: "CustomerPayBillOnline",
          Amount: Math.ceil(amount),
          PartyA: formattedPhone,
          PartyB: shortcode,
          PhoneNumber: formattedPhone,
          CallBackURL: callbackUrl,
          AccountReference: account_reference || "HMS-Payment",
          TransactionDesc: "Hospital Payment",
        }),
      });

      const stkData = await stkRes.json();

      if (stkData.ResponseCode === "0") {
        // Create payment record
        const { data: payment, error: paymentError } = await supabase
          .from("payments")
          .insert({
            hospital_id,
            patient_id,
            invoice_id: invoice_id || null,
            amount,
            payment_method: "mpesa",
            payment_status: "processing",
            phone_number: formattedPhone,
            mpesa_checkout_request_id: stkData.CheckoutRequestID,
            transaction_reference: account_reference || "HMS-Payment",
          })
          .select()
          .single();

        if (paymentError) throw paymentError;

        return new Response(JSON.stringify({
          success: true,
          checkout_request_id: stkData.CheckoutRequestID,
          payment_id: payment.id,
          message: "STK Push sent to phone. Enter M-Pesa PIN to complete.",
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } else {
        return new Response(JSON.stringify({ success: false, error: stkData.errorMessage || "STK Push failed" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // === M-PESA CALLBACK HANDLER ===
    if (action === "callback" || req.url.includes("callback")) {
      const body = payload.Body?.stkCallback || payload;
      const checkoutRequestID = body.CheckoutRequestID;
      const resultCode = body.ResultCode;

      if (resultCode === 0) {
        const items = body.CallbackMetadata?.Item || [];
        const mpesaReceipt = items.find((i: any) => i.Name === "MpesaReceiptNumber")?.Value;
        const amount = items.find((i: any) => i.Name === "Amount")?.Value;

        await supabase
          .from("payments")
          .update({
            payment_status: "completed",
            mpesa_receipt_number: mpesaReceipt,
            paid_at: new Date().toISOString(),
          })
          .eq("mpesa_checkout_request_id", checkoutRequestID);

        // Also update the linked invoice
        const { data: payment } = await supabase
          .from("payments")
          .select("invoice_id")
          .eq("mpesa_checkout_request_id", checkoutRequestID)
          .single();

        if (payment?.invoice_id) {
          await supabase
            .from("invoices")
            .update({ status: "paid" })
            .eq("id", payment.invoice_id);
        }
      } else {
        await supabase
          .from("payments")
          .update({ payment_status: "failed" })
          .eq("mpesa_checkout_request_id", checkoutRequestID);
      }

      return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Record a non-M-Pesa payment (cash, card, bank transfer)
    if (action === "record_payment") {
      const { hospital_id, patient_id, invoice_id, amount, payment_method, transaction_reference, notes } = payload;

      const { data: payment, error } = await supabase
        .from("payments")
        .insert({
          hospital_id,
          patient_id,
          invoice_id: invoice_id || null,
          amount,
          payment_method,
          payment_status: "completed",
          transaction_reference,
          notes,
          paid_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Update invoice status if linked
      if (invoice_id) {
        await supabase.from("invoices").update({ status: "paid" }).eq("id", invoice_id);
      }

      return new Response(JSON.stringify({ success: true, payment }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("M-Pesa error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
