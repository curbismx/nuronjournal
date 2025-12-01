import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import backIcon from "@/assets/back-new.png";

const AccountDetails = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        
        if (profile) {
          setUserProfile(profile);
        }
      }
    };
    getUser();
  }, []);

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
      await supabase
        .from("notes")
        .delete()
        .eq("user_id", user.id);

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
    <div className="min-h-screen bg-journal-header">
      <header className="sticky top-0 h-[80px] bg-journal-header flex items-center px-8 z-10">
        <button
          onClick={() => navigate("/")}
          className="absolute left-[30px] top-0"
        >
          <img src={backIcon} alt="Back" className="h-[24px] w-auto" />
        </button>
      </header>

      <div className="absolute inset-x-0 top-[80px] bottom-0 bg-journal-header px-8 pt-8 overflow-y-auto">
        <h1 className="text-journal-header-foreground text-[24px] font-outfit font-light tracking-wider leading-none mb-8">
          ACCOUNT DETAILS
        </h1>
        <div className="text-white font-outfit space-y-6">
          {user && userProfile && (
            <>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-white/60 text-[12px] uppercase tracking-wider">Name</Label>
                  <div className="bg-white/5 border border-white/20 text-white rounded-[10px] px-3 py-2 text-[16px]">
                    {userProfile.name || 'Not set'}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-white/60 text-[12px] uppercase tracking-wider">Email</Label>
                  <div className="bg-white/5 border border-white/20 text-white rounded-[10px] px-3 py-2 text-[16px]">
                    {userProfile.email}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-white/60 text-[12px] uppercase tracking-wider">Password</Label>
                  <div className="bg-white/5 border border-white/20 text-white rounded-[10px] px-3 py-2 text-[16px]">
                    ••••••••
                  </div>
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={handleSignOut}
                  className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-[10px] transition-colors text-[14px]"
                >
                  Sign Out
                </button>
                <button
                  onClick={handleDeleteAccount}
                  className="flex-1 px-6 py-3 bg-red-500/20 hover:bg-red-500/30 text-white rounded-[10px] transition-colors text-[14px]"
                >
                  Delete Account
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountDetails;
