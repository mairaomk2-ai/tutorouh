import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ProfilePhotoUploadProps {
  currentPhoto?: string;
  userName: string;
  className?: string;
}

export function ProfilePhotoUpload({
  currentPhoto,
  userName,
  className = "",
}: ProfilePhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadOptions, setShowUploadOptions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("profileImage", file);
      
      const response = await apiRequest("POST", "/api/auth/upload-profile", formData);
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile photo updated",
        description: "Your profile photo has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
    onError: () => {
      toast({
        title: "Upload failed",
        description: "Failed to upload profile photo. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsUploading(false);
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    uploadMutation.mutate(file);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const initials = userName
    .split(" ")
    .map((name) => name.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={`relative inline-block ${className} group`}>
      <Avatar className="w-24 h-24 cursor-pointer transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg" onClick={handleUploadClick}>
        <AvatarImage src={currentPhoto} alt={userName} />
        <AvatarFallback className="text-lg font-semibold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
          {initials}
        </AvatarFallback>
      </Avatar>
      
      <Button
        size="sm"
        variant="secondary"
        className="absolute -bottom-2 -right-2 rounded-full p-2 h-8 w-8 shadow-lg premium-button border-2 border-white transition-all duration-300 hover:scale-110"
        onClick={handleUploadClick}
        disabled={isUploading}
      >
        {isUploading ? (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <Camera className="w-4 h-4" />
        )}
      </Button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}

export default ProfilePhotoUpload;