import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Badge,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Separator,
  Input,
  Label,
} from "@workspace/ui";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary" />
            <span className="text-xl font-bold">Portfolio</span>
          </div>
          <nav className="flex items-center gap-4">
            <Button variant="ghost">About</Button>
            <Button variant="ghost">Projects</Button>
            <Button variant="ghost">Contact</Button>
            <Button>Get Started</Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24 text-center">
        <Badge className="mb-4" variant="secondary">
          shadcn/ui ажиллаж байна
        </Badge>
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          Welcome to Your Portfolio
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          This is a demo page showcasing shadcn/ui components in your Turborepo monorepo.
          All components are imported from @workspace/ui.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Button size="lg">Get Started</Button>
          <Button size="lg" variant="outline">
            Learn More
          </Button>
        </div>
      </section>

      <Separator />

      {/* Cards Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="mb-8 text-center text-3xl font-bold">Featured Projects</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Project Alpha</CardTitle>
              <CardDescription>A revolutionary web application</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Built with Next.js, TypeScript, and Tailwind CSS. Features real-time updates and seamless user experience.
              </p>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Badge>React</Badge>
              <Button variant="outline" size="sm">
                View Project
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Project Beta</CardTitle>
              <CardDescription>Mobile-first design system</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                A comprehensive design system with reusable components and consistent styling across all platforms.
              </p>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Badge variant="secondary">Design</Badge>
              <Button variant="outline" size="sm">
                View Project
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Project Gamma</CardTitle>
              <CardDescription>AI-powered analytics</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Machine learning algorithms that provide actionable insights from complex datasets.
              </p>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Badge variant="outline">AI/ML</Badge>
              <Button variant="outline" size="sm">
                View Project
              </Button>
            </CardFooter>
          </Card>
        </div>
      </section>

      <Separator />

      {/* Team Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="mb-8 text-center text-3xl font-bold">Team Members</h2>
        <div className="flex flex-wrap justify-center gap-8">
          <div className="flex flex-col items-center gap-2">
            <Avatar className="h-20 w-20">
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <span className="font-medium">John Doe</span>
            <span className="text-sm text-muted-foreground">Developer</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Avatar className="h-20 w-20">
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <span className="font-medium">Jane Smith</span>
            <span className="text-sm text-muted-foreground">Designer</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Avatar className="h-20 w-20">
              <AvatarFallback>MK</AvatarFallback>
            </Avatar>
            <span className="font-medium">Mike Johnson</span>
            <span className="text-sm text-muted-foreground">Manager</span>
          </div>
        </div>
      </section>

      <Separator />

      {/* Contact Form */}
      <section className="container mx-auto px-4 py-16">
        <Card className="mx-auto max-w-md">
          <CardHeader>
            <CardTitle>Contact Us</CardTitle>
            <CardDescription>Send us a message and we will get back to you.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="Enter your name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="Enter your email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Input id="message" placeholder="Enter your message" />
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full">Send Message</Button>
          </CardFooter>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <span className="text-sm text-muted-foreground">
            © 2024 Portfolio. Built with shadcn/ui & Turborepo.
          </span>
          <div className="flex gap-4">
            <Button variant="ghost" size="sm">
              Privacy
            </Button>
            <Button variant="ghost" size="sm">
              Terms
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}
