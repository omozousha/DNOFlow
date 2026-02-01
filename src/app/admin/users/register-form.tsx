"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";

export default function RegisterForm({ onSuccess }: { onSuccess?: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("controller");
  const [division, setDivision] = useState("PLANNING");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      toast.loading("Creating account...", { id: "register-toast" });
      
      // Create auth user with metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role,
            division: division,
          },
        },
      });
      
      if (authError) throw authError;
      
      if (authData.user) {
        // Wait a bit for trigger to complete
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Verify profile was created and update if needed
        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", authData.user.id)
          .single();
        
        if (!existingProfile) {
          // Trigger didn't work, create manually
          console.warn("Trigger didn't create profile, creating manually");
          const { error: profileError } = await supabase
            .from("profiles")
            .insert({
              id: authData.user.id,
              email: authData.user.email!,
              role: role,
              full_name: fullName,
              is_active: true,
              access: "edit",
              division: division,
            });
          
          if (profileError) {
            console.error("Failed to create profile:", profileError);
            throw new Error("User created in auth but profile creation failed: " + profileError.message);
          }
        } else {
          // Profile exists, ensure all fields are correct
          const { error: updateError } = await supabase
            .from("profiles")
            .update({
              role: role,
              full_name: fullName,
              division: division,
              access: "edit",
              is_active: true,
            })
            .eq("id", authData.user.id);
          
          if (updateError) {
            console.warn("Failed to update profile:", updateError);
          }
        }
        
        // Also create entry in users_roles for backward compatibility
        const { error: rolesError } = await supabase
          .from("users_roles")
          .upsert({
            user_id: authData.user.id,
            role: role,
          }, {
            onConflict: "user_id"
          });
        
        if (rolesError) {
          console.warn("Failed to create users_roles entry:", rolesError);
        }
        
        setSuccess("User created successfully!");
        toast.success("User created successfully!", { id: "register-toast" });
        setEmail("");
        setPassword("");
        setFullName("");
        setRole("controller");
        setDivision("PLANNING");
        if (onSuccess) onSuccess();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
      toast.error(message, { id: "register-toast" });
    } finally {
      setLoading(false);
    }
  };
    
      return (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="Test User"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="test@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="password123"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={setRole} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="owner">Owner</SelectItem>
                <SelectItem value="controller">Controller</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="division">Division</Label>
            <Select value={division} onValueChange={setDivision} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="Select division" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PLANNING">PLANNING</SelectItem>
                <SelectItem value="DEPLOYMENT">DEPLOYMENT</SelectItem>
                <SelectItem value="OPERATIONS">OPERATIONS</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2 flex flex-col gap-2">
            {error && <div className="text-red-500 text-sm">{error}</div>}
            {success && <div className="text-green-500 text-sm">{success}</div>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Spinner className="mr-2" /> Creating...
                </>
              ) : (
                "Create User"
              )}
            </Button>
          </div>
        </form>
      );
    }
