import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import backIcon from "@/assets/back-new.png";

const AccountDetails = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        setEmail(user.email || "");
        
        const { data: profile } = await supabase
          .from("profiles")
          .select("name")
          .eq("id", user.id)
          .single();
        
        if (profile) {
          setName(profile.name || "");
        }
      }
    };
    getUser();
  }, []);

  const handleUpdateProfile = async () => {
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update({ name })
      .eq("id", user.id);

    if (error) {
      toast.error("Failed to update profile");
    } else {
      toast.success("Profile updated successfully");
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword) {
      toast.error("Please enter a new password");
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      toast.error("Failed to update password");
    } else {
      toast.success("Password updated successfully");
      setNewPassword("");
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This action cannot be undone."
    );

    if (confirmed) {
      // Delete user's notes first
      await supabase
        .from("notes")
        .delete()
        .eq("user_id", user.id);

      // Delete user's profile
      await supabase
        .from("profiles")
        .delete()
        .eq("id", user.id);

      toast.success("Account deleted successfully");
      await supabase.auth.signOut();
      navigate("/auth");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header with back button */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate("/")}
            className="mr-4"
          >
            <img src={backIcon} alt="Back" className="w-[30px] h-auto" />
          </button>
          <h1 className="text-2xl font-medium text-foreground">ACCOUNT DETAILS</h1>
        </div>

        {/* Account form */}
        <div className="space-y-4">
          <div className="bg-muted/20 backdrop-blur-sm p-4 rounded-[10px]">
            <label className="text-sm text-muted-foreground mb-2 block">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-background/50"
            />
          </div>

          <div className="bg-muted/20 backdrop-blur-sm p-4 rounded-[10px]">
            <label className="text-sm text-muted-foreground mb-2 block">Email</label>
            <Input
              value={email}
              disabled
              className="bg-background/50"
            />
          </div>

          <div className="bg-muted/20 backdrop-blur-sm p-4 rounded-[10px]">
            <label className="text-sm text-muted-foreground mb-2 block">New Password</label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              className="bg-background/50"
            />
          </div>

          <Button
            onClick={handleUpdateProfile}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-[10px]"
          >
            Save Changes
          </Button>

          <Button
            onClick={handleUpdatePassword}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-[10px]"
          >
            Update Password
          </Button>

          <Button
            onClick={handleSignOut}
            className="w-full bg-muted hover:bg-muted/80 text-foreground rounded-[10px]"
          >
            Sign Out
          </Button>

          <Button
            onClick={handleDeleteAccount}
            className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-[10px]"
          >
            Delete Account
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AccountDetails;
