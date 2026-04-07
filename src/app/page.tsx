import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BotIcon, ZapIcon, BarChartIcon, TrendingUp, Package, Scale } from 'lucide-react';
import { AnimatedHero } from '@/components/animated-hero';
import { AnalyzeUpIcon } from '@/components/analyze-up-icon';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-[100dvh] bg-background text-foreground">
      <header className="px-4 lg:px-6 h-16 flex items-center sticky top-0 z-50 bg-background/70 backdrop-blur-xl border-b">
        <Link href="/" className="flex items-center justify-center">
          <AnalyzeUpIcon className="h-6 w-6 text-primary" />
          <span className="ml-2 font-semibold text-xl">AnalyzeUp</span>
        </Link>
        <nav className="ml-auto flex gap-2 sm:gap-4 items-center">
          <Link
            href="#features"
            className="text-sm font-medium hover:text-primary transition-colors text-muted-foreground"
          >
            Features
          </Link>
          <Link
            href="/login"
          >
            <Button variant="ghost">Sign In</Button>
          </Link>
          <Link href="/register">
            <Button>Get Started</Button>
          </Link>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full pt-12 pb-20 md:pt-16 md:pb-24 lg:pt-20 lg:pb-32 animated-grid-background">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_500px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-6">
                <div className="space-y-4">
                  <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none text-foreground">
                    The Smartest Way to Manage Your Inventory
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    AnalyzeUp provides a powerful and intuitive platform to
                    streamline your stock, track sales, and make data-driven
                    decisions with the power of AI.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link
                    href="/register"
                  >
                    <Button size="lg">Get Started Free</Button>
                  </Link>
                  <Link
                    href="#features"
                  >
                    <Button size="lg" variant="secondary">Learn More</Button>
                  </Link>
                </div>
              </div>
              <div className="flex items-center justify-center lg:order-last min-h-[250px] lg:min-h-[300px] pt-8">
                  <AnimatedHero />
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32 bg-secondary/30">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-3">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Built for Ambitious Brands</h2>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Stop juggling spreadsheets and start making intelligent decisions. AnalyzeUp is the all-in-one platform for e-commerce stores and growing businesses that need to move faster.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3 lg:gap-16 mt-12">
              <div className="grid gap-2">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center rounded-lg bg-primary/10 p-3 text-primary">
                    <Package className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold">Streamline Operations</h3>
                </div>
                <p className="text-muted-foreground">
                  Centralize your inventory, orders, and suppliers. Reduce manual errors and save hours of administrative work every week.
                </p>
              </div>
              <div className="grid gap-2">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center rounded-lg bg-primary/10 p-3 text-primary">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold">Data-Driven Decisions</h3>
                </div>
                <p className="text-muted-foreground">
                  Get real-time insights into your sales trends, best-performing products, and inventory value to capitalize on opportunities.
                </p>
              </div>
              <div className="grid gap-2">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center rounded-lg bg-primary/10 p-3 text-primary">
                    <Scale className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold">Scale with Confidence</h3>
                </div>
                <p className="text-muted-foreground">
                  With AI-powered demand forecasting and strategic advice, you'll have the tools you need to grow your business sustainably.
                </p>
              </div>
            </div>
          </div>
        </section>
        <section
          id="features"
          className="w-full py-12 md:py-24 lg:py-32"
        >
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-full bg-secondary px-3 py-1 text-sm font-medium">
                  Key Features
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-foreground">
                  Everything You Need to Succeed
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Our platform is packed with features to help you manage your
                  inventory efficiently, gain valuable insights, and grow your
                  business.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 py-12 lg:grid-cols-3 lg:gap-12">
              <div className="grid gap-2">
                 <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center rounded-lg bg-primary/10 p-3 text-primary">
                    <BotIcon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold">AI-Powered Insights</h3>
                </div>
                <p className="text-muted-foreground">
                  Leverage artificial intelligence to get smart reorder
                  suggestions, generate product descriptions, and analyze market
                  trends.
                </p>
              </div>
               <div className="grid gap-2">
                 <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center rounded-lg bg-primary/10 p-3 text-primary">
                    <ZapIcon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold">Real-Time Tracking</h3>
                </div>
                <p className="text-muted-foreground">
                  Monitor your stock levels, sales, and orders in real-time
                  from anywhere. Never miss a beat with our synchronized
                  dashboard.
                </p>
              </div>
              <div className="grid gap-2">
                <div className="flex items-center gap-3">
                   <div className="flex items-center justify-center rounded-lg bg-primary/10 p-3 text-primary">
                    <BarChartIcon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold">Comprehensive Reports</h3>
                </div>
                <p className="text-muted-foreground">
                  Generate detailed reports on sales, inventory value, and top-performing products to make informed business decisions.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">
          &copy; 2024 AnalyzeUp. All rights reserved.
        </p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link
            href="#"
            className="text-xs hover:underline underline-offset-4 text-muted-foreground"
          >
            Terms of Service
          </Link>
          <Link
            href="#"
            className="text-xs hover:underline underline-offset-4 text-muted-foreground"
          >
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
