
CREATE POLICY "Creator can view their hospital"
ON public.hospitals
FOR SELECT
TO authenticated
USING (auth.uid() = created_by);
