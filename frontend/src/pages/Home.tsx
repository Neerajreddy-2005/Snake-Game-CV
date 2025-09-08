import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Gamepad2, 
  Camera, 
  Hand, 
  Zap, 
  PlayCircle,
  ArrowRight 
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Home() {
  const features = [
    {
      icon: <Hand className="h-8 w-8 text-primary" />,
      title: "Gesture Control",
      description: "Control the snake using natural hand gestures detected by your camera"
    },
    {
      icon: <Camera className="h-8 w-8 text-primary" />,
      title: "Real-time Vision",
      description: "Advanced computer vision tracks your hand movements in real-time"
    },
    {
      icon: <Zap className="h-8 w-8 text-primary" />,
      title: "Instant Response",
      description: "Ultra-low latency ensures your gestures translate immediately to game actions"
    },
    {
      icon: <Gamepad2 className="h-8 w-8 text-primary" />,
      title: "Classic Gameplay",
      description: "Enjoy the timeless Snake game with a revolutionary control method"
    }
  ];

  const gestureMap = [
    { gesture: "Point Up ☝️", direction: "Move Up", color: "text-blue-400" },
    { gesture: "Point Down 👇", direction: "Move Down", color: "text-green-400" },
    { gesture: "Point Left 👈", direction: "Move Left", color: "text-yellow-400" },
    { gesture: "Point Right 👉", direction: "Move Right", color: "text-red-400" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Gamepad2 className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Gesture Snake
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" asChild>
                <Link to="/">Home</Link>
              </Button>
              <Button asChild>
                <Link to="/dashboard">
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Play Game
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center space-y-6 max-w-4xl mx-auto">
          <Badge variant="secondary" className="mb-4">
            🚀 Next-Gen Gaming Experience
          </Badge>
          
          <h1 className="text-6xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent leading-tight">
            Play Snake with
            <br />
            <span className="text-primary">Hand Gestures</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Experience the classic Snake game like never before. Control your snake using natural hand movements 
            detected by your camera - no keyboard, no mouse, just your hands.
          </p>

          <div className="flex items-center justify-center gap-4 pt-8">
            <Button size="lg" asChild className="text-lg px-8 py-6">
              <Link to="/dashboard">
                <PlayCircle className="h-5 w-5 mr-2" />
                Start Playing
                <ArrowRight className="h-5 w-5 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">How It Works</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Simply point in the direction you want your snake to move. Our AI-powered vision system 
            recognizes your gestures instantly.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {gestureMap.map((item, index) => (
            <Card key={index} className="p-6 text-center bg-gradient-to-br from-card to-secondary">
              <div className="text-4xl mb-4">{item.gesture.split(' ')[1]}</div>
              <h3 className="font-semibold mb-2">{item.gesture.split(' ')[0]}</h3>
              <p className={`text-sm ${item.color} font-medium`}>
                {item.direction}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Why Choose Gesture Snake?</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Revolutionary technology meets classic gameplay for an unforgettable gaming experience.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {features.map((feature, index) => (
            <Card key={index} className="p-6 bg-gradient-to-br from-card to-secondary">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <Card className="p-12 text-center bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-4xl font-bold">Ready to Play?</h2>
            <p className="text-muted-foreground text-lg">
              Make sure your camera is connected and start playing Snake with just your hand gestures!
            </p>
            <Button size="lg" asChild className="text-lg px-8 py-6">
              <Link to="/dashboard">
                <PlayCircle className="h-5 w-5 mr-2" />
                Launch Game Dashboard
              </Link>
            </Button>
          </div>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>Built with React, TypeScript, and advanced computer vision technology.</p>
        </div>
      </footer>
    </div>
  );
}