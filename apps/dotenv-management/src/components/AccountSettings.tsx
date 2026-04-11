import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Avatar,
  AvatarFallback,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui";

export function AccountSettings() {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Account</h2>

      <Tabs defaultValue="settings" className="mb-8">
        <TabsList className="bg-zinc-900 border-b border-zinc-800">
          <TabsTrigger
            value="settings"
            className="data-[state=active]:bg-zinc-800"
          >
            Account Settings
          </TabsTrigger>
          <TabsTrigger value="cards" className="data-[state=active]:bg-zinc-800">
            Cards
          </TabsTrigger>
          <TabsTrigger
            value="transactions"
            className="data-[state=active]:bg-zinc-800"
          >
            Transactions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="mt-8">
          {/* Profile Section */}
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16 bg-emerald-500">
                <AvatarFallback className="bg-emerald-500 text-black font-bold text-xl">
                  GS
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-semibold">George Stoitzev</h3>
                <p className="text-sm text-zinc-400">brandon@bluesonik.com</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="border-zinc-700 text-white hover:bg-zinc-800"
              >
                Change Image
              </Button>
              <Button
                variant="outline"
                className="border-red-900/50 text-red-500 hover:bg-red-950/30"
              >
                Delete Image
              </Button>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-zinc-400">Street Adress</Label>
                <Input
                  defaultValue="360 West Hubbard Street Chicago, IL 60654"
                  className="bg-zinc-900 border-zinc-800 text-white h-12"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-zinc-400">Floor / Suite / Office</Label>
                <Input
                  defaultValue="Home"
                  className="bg-zinc-900 border-zinc-800 text-white h-12"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-zinc-400">City</Label>
                <Input
                  defaultValue="Miami"
                  className="bg-zinc-900 border-zinc-800 text-white h-12"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-zinc-400">State</Label>
                <Input
                  defaultValue="Florida"
                  className="bg-zinc-900 border-zinc-800 text-white h-12"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-zinc-400">State</Label>
                <Select defaultValue="select">
                  <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white h-12">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800">
                    <SelectItem value="select">Select</SelectItem>
                    <SelectItem value="florida">Florida</SelectItem>
                    <SelectItem value="california">California</SelectItem>
                    <SelectItem value="texas">Texas</SelectItem>
                    <SelectItem value="newyork">New York</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="cards">
          <div className="text-zinc-400">Cards content...</div>
        </TabsContent>

        <TabsContent value="transactions">
          <div className="text-zinc-400">Transactions content...</div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
