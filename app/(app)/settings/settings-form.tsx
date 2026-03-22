'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { updateProfile, deleteAccount, type ProfileState } from '@/server/actions/user'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

function SaveButton() {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Saving...' : 'Save changes'}
    </Button>
  )
}

function DeleteButton() {
  const { pending } = useFormStatus()

  return (
    <AlertDialogAction type="submit" disabled={pending}>
      {pending ? 'Deleting...' : 'Delete account'}
    </AlertDialogAction>
  )
}

interface SettingsFormProps {
  user: {
    name: string
    email: string
  }
}

export function SettingsForm({ user }: SettingsFormProps) {
  const [profileState, profileAction] = useActionState(updateProfile, {
    message: '',
    errors: {},
  } satisfies ProfileState)

  const [deleteState, deleteAction] = useActionState(deleteAccount, {
    message: '',
    errors: {},
  } satisfies ProfileState)

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your profile information and how others see you
              </CardDescription>
            </CardHeader>
            <form action={profileAction}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Your name"
                    defaultValue={user.name}
                  />
                  {profileState?.errors?.name && (
                    <p className="text-sm text-destructive">{profileState.errors.name}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="your@email.com"
                    defaultValue={user.email}
                  />
                  {profileState?.errors?.email && (
                    <p className="text-sm text-destructive">{profileState.errors.email}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    className="min-h-[100px]"
                    placeholder="Tell us about yourself"
                  />
                  {profileState?.errors?.bio && (
                    <p className="text-sm text-destructive">{profileState.errors.bio}</p>
                  )}
                </div>
                {profileState?.message && (
                  <p className={`text-sm ${profileState.success ? 'text-green-500' : 'text-destructive'}`}>
                    {profileState.message}
                  </p>
                )}
              </CardContent>
              <CardFooter>
                <SaveButton />
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>
                Manage your account security and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Two-factor authentication</p>
                  <p className="text-sm text-muted-foreground">
                    Add an extra layer of security to your account
                  </p>
                </div>
                <span className="text-sm text-muted-foreground">Coming soon</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Sessions</p>
                  <p className="text-sm text-muted-foreground">
                    Manage your active sessions
                  </p>
                </div>
                <span className="text-sm text-muted-foreground">Coming soon</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600">Danger Zone</CardTitle>
              <CardDescription>
                Irreversible actions for your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">Delete Account</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your
                      account and remove your data from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <form action={deleteAction}>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <DeleteButton />
                    </AlertDialogFooter>
                  </form>
                </AlertDialogContent>
              </AlertDialog>
              {deleteState?.message && (
                <p className="mt-4 text-sm text-destructive">{deleteState.message}</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>
                Configure which email notifications you receive. Preferences will take
                effect once notification delivery is available.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notifications-security">Security alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive alerts about your account security
                  </p>
                </div>
                <Switch id="notifications-security" defaultChecked disabled />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notifications-marketing">Marketing emails</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive updates about new features and offers
                  </p>
                </div>
                <Switch id="notifications-marketing" disabled />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notifications-digest">Weekly digest</Label>
                  <p className="text-sm text-muted-foreground">
                    A weekly summary of your activity
                  </p>
                </div>
                <Switch id="notifications-digest" defaultChecked disabled />
              </div>
              <p className="text-sm text-muted-foreground pt-2">
                Notification delivery is coming soon. These preferences will be saved
                once the feature is available.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
