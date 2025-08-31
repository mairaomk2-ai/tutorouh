import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface KycModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function KycModal({ isOpen, onClose }: KycModalProps) {
  const { toast } = useToast();
  const [files, setFiles] = useState<{
    aadhaar: File | null;
    pan: File | null;
    selfie: File | null;
  }>({
    aadhaar: null,
    pan: null,
    selfie: null,
  });

  const submitKycMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      if (files.aadhaar) formData.append("aadhaar", files.aadhaar);
      if (files.pan) formData.append("pan", files.pan);
      if (files.selfie) formData.append("selfie", files.selfie);

      const response = await fetch("/api/kyc/submit", {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("tutoro_token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to submit KYC");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "KYC Submitted",
        description: "Your KYC is under review. You will be notified once approved.",
      });
      onClose();
      setFiles({ aadhaar: null, pan: null, selfie: null });
    },
    onError: (error: any) => {
      toast({
        title: "KYC Submission Failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (type: "aadhaar" | "pan" | "selfie", file: File | null) => {
    setFiles(prev => ({ ...prev, [type]: file }));
  };

  const handleSubmit = () => {
    if (!files.aadhaar || !files.pan || !files.selfie) {
      toast({
        title: "Missing Documents",
        description: "Please upload all required documents",
        variant: "destructive",
      });
      return;
    }

    submitKycMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Complete KYC Verification</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <Label htmlFor="aadhaar">Aadhaar Card *</Label>
            <Input
              id="aadhaar"
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange("aadhaar", e.target.files?.[0] || null)}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="pan">PAN Card *</Label>
            <Input
              id="pan"
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange("pan", e.target.files?.[0] || null)}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="selfie">Selfie *</Label>
            <Input
              id="selfie"
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange("selfie", e.target.files?.[0] || null)}
              className="mt-2"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={submitKycMutation.isPending}
              className="bg-primary hover:bg-primary/90"
            >
              {submitKycMutation.isPending ? "Submitting..." : "Submit KYC"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
