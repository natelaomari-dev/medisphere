import { useLocation } from "react-router-dom";
import { Construction } from "lucide-react";
import { motion } from "framer-motion";

export default function PlaceholderPage() {
  const location = useLocation();
  const name = location.pathname.slice(1).replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()) || "Module";

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <div className="h-14 w-14 rounded-xl bg-muted flex items-center justify-center mx-auto mb-4">
          <Construction className="h-6 w-6 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">{name}</h2>
        <p className="text-sm text-muted-foreground mt-1">This module is coming soon</p>
      </motion.div>
    </div>
  );
}
