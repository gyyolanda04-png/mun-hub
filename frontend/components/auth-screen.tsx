"use client"

import { useState } from "react"
import { Gavel, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth"
import { ApiError } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function AuthScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="flex w-full max-w-sm flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-2">
          <div className="flex size-11 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Gavel className="size-6" aria-hidden="true" />
          </div>
          <div className="text-center">
            <h1 className="font-serif text-xl font-semibold text-foreground">MUN Hub</h1>
            <p className="text-sm text-muted-foreground">Sign in to manage your committees</p>
          </div>
        </div>

        <Card className="w-full p-5">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="mb-4 w-full">
              <TabsTrigger value="login" className="flex-1">
                Log in
              </TabsTrigger>
              <TabsTrigger value="register" className="flex-1">
                Create account
              </TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <AuthForm mode="login" />
            </TabsContent>
            <TabsContent value="register">
              <AuthForm mode="register" />
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  )
}

function AuthForm({ mode }: { mode: "login" | "register" }) {
  const { login, register } = useAuth()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [busy, setBusy] = useState(false)

  async function submit() {
    if (!username.trim() || !password) {
      toast.error("Enter a username and password.")
      return
    }
    setBusy(true)
    try {
      if (mode === "login") {
        await login(username.trim(), password)
      } else {
        await register(username.trim(), password)
        toast.success(`Welcome, ${username.trim()}!`)
      }
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Something went wrong. Please try again."
      toast.error(message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        void submit()
      }}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${mode}-username`}>Username</Label>
        <Input
          id={`${mode}-username`}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoFocus
          autoComplete="username"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${mode}-password`}>Password</Label>
        <Input
          id={`${mode}-password`}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
        />
      </div>
      <Button type="submit" disabled={busy} className="mt-1">
        {busy ? <Loader2 className="size-4 animate-spin" /> : null}
        {mode === "login" ? "Log in" : "Create account"}
      </Button>
    </form>
  )
}
