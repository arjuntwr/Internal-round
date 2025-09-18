import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { ArrowRight, Wheat, Truck, Store, ShoppingCart, Shield, Clock, Globe } from "lucide-react";
import heroImage from "@/assets/supply-chain-hero.jpg";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 hero-gradient opacity-10" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in-up">
              <h1 className="text-display mb-6">
                🌾 Track Your Produce<br />
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  From Farm to Table
                </span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Blockchain-powered supply chain transparency that builds trust between farmers, 
                distributors, and consumers through immutable tracking records.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="xl" variant="hero">
                  <Link to="/farmer">
                    Get Started
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild size="xl" variant="outline">
                  <Link to="/consumer">
                    Track Produce
                  </Link>
                </Button>
              </div>
            </div>
            <div className="animate-slide-in-right">
              <img 
                src={heroImage} 
                alt="Supply chain journey from farm to consumer" 
                className="w-full rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="text-section mb-4">How Our Supply Chain Works</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Follow your produce through every step of its journey with complete transparency and blockchain security.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Wheat className="h-8 w-8 text-primary" />,
                title: "📝 Register Produce",
                description: "Farmers add crop batches with harvest dates and details to the blockchain.",
                link: "/farmer",
                delay: "0s"
              },
              {
                icon: <Truck className="h-8 w-8 text-secondary" />,
                title: "🔄 Transfer Ownership", 
                description: "Distributors transfer ownership with pricing and destination information.",
                link: "/distributor",
                delay: "0.1s"
              },
              {
                icon: <Store className="h-8 w-8 text-accent" />,
                title: "📊 Track History",
                description: "Consumers view the complete journey from farm to their table.",
                link: "/consumer", 
                delay: "0.2s"
              },
              {
                icon: <Shield className="h-8 w-8 text-success" />,
                title: "🔒 Secure Blockchain",
                description: "All records are immutable and stored permanently on the blockchain.",
                link: "/",
                delay: "0.3s"
              }
            ].map((feature, index) => (
              <Card 
                key={index}
                className="supply-chain-card animate-fade-in-up text-center hover:scale-105 transition-transform"
                style={{ animationDelay: feature.delay }}
              >
                <CardHeader>
                  <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-card-title">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{feature.description}</p>
                  {feature.link !== "/" && (
                    <Button asChild variant="outline" size="sm">
                      <Link to={feature.link}>
                        Try It <ArrowRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-12 items-center">
            <div className="lg:col-span-1 animate-fade-in-up">
              <h2 className="text-section mb-6">Why Choose Blockchain Supply Chain?</h2>
              <p className="text-muted-foreground mb-8">
                Our platform provides unparalleled transparency, security, and trust in the food supply chain.
              </p>
              <Button asChild variant="hero" size="lg">
                <Link to="/farmer">Start Tracking</Link>
              </Button>
            </div>
            
            <div className="lg:col-span-2 grid md:grid-cols-2 gap-6">
              {[
                {
                  icon: <Clock className="h-6 w-6 text-primary" />,
                  title: "Real-time Tracking",
                  description: "Monitor your produce journey in real-time with instant updates."
                },
                {
                  icon: <Shield className="h-6 w-6 text-success" />,
                  title: "Immutable Records",
                  description: "Blockchain technology ensures data cannot be altered or faked."
                },
                {
                  icon: <Globe className="h-6 w-6 text-secondary" />,
                  title: "Global Standards",
                  description: "Compatible with international food safety and traceability standards."
                },
                {
                  icon: <ShoppingCart className="h-6 w-6 text-accent" />,
                  title: "Consumer Trust",
                  description: "Build customer confidence with complete supply chain transparency."
                }
              ].map((benefit, index) => (
                <Card 
                  key={index}
                  className="supply-chain-card animate-slide-in-right"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-lg">
                      {benefit.icon}
                      {benefit.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{benefit.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto animate-fade-in-up">
            <h2 className="text-section mb-6">Ready to Transform Your Supply Chain?</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join thousands of farmers, distributors, and retailers using blockchain for complete supply chain transparency.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="xl" variant="hero">
                <Link to="/farmer">
                  <Wheat className="mr-2 h-5 w-5" />
                  I'm a Farmer
                </Link>
              </Button>
              <Button asChild size="xl" variant="outline">
                <Link to="/distributor">
                  <Truck className="mr-2 h-5 w-5" />
                  I'm a Distributor
                </Link>
              </Button>
              <Button asChild size="xl" variant="outline">
                <Link to="/consumer">
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  I'm a Consumer
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;