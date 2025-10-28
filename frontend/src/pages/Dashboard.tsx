import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Gamepad2, 
  Settings, 
  ChevronDown, 
  Play, 
  Square,
  Home,
  ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { GameBoard } from '@/components/GameBoard';
import { GestureController } from '@/components/GestureController';
import { StatusPanel } from '@/components/StatusPanel';
import { CalibrationPanel } from '@/components/CalibrationPanel';
import { startGame, stopGame } from '@/services/api';

export default function Dashboard() {
  const [gameStarted, setGameStarted] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [currentDirection] = useState(1);

  const handleStartGame = async () => {
    try {
      await startGame();
      setGameStarted(true);
    } catch (err) {
      console.error('Failed to start game', err);
    }
  };

  const handleStopGame = async () => {
    try {
      await stopGame();
    } catch (err) {
      console.error('Failed to stop game', err);
    } finally {
      setGameStarted(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" asChild>
                <Link to="/">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <Gamepad2 className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">Game Dashboard</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <Button variant="ghost" asChild>
                <Link to="/">
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </Link>
              </Button>
              
              {gameStarted ? (
                <Button 
                  onClick={handleStopGame}
                  variant="destructive"
                  className="gap-2"
                >
                  <Square className="h-4 w-4" />
                  Stop Game
                </Button>
              ) : (
                <Button 
                  onClick={handleStartGame}
                  className="gap-2"
                >
                  <Play className="h-4 w-4" />
                  Start Game
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Calibration trigger always visible and consistent */}
      {gameStarted && (
        <div className="border-b border-border bg-muted/30">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span>Calibration Settings</span>
            </div>
            <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
              <DialogTrigger asChild>
                <Button className="px-4">Open</Button>
              </DialogTrigger>
              <DialogContent className="max-w-[75vw] w-[75vw] h-[75vh]">
                <DialogHeader>
                  <DialogTitle>Calibration Settings</DialogTitle>
                </DialogHeader>
                <div className="overflow-auto pr-2 h-full">
                  <CalibrationPanel onApplied={() => setSettingsOpen(false)} />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {!gameStarted ? (
          /* Pre-Game State */
          <div className="max-w-2xl mx-auto text-center space-y-8">
            <Card className="p-12 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
              <div className="space-y-6">
                <div className="w-24 h-24 mx-auto bg-primary/20 rounded-full flex items-center justify-center">
                  <Gamepad2 className="h-12 w-12 text-primary" />
                </div>
                
                <div>
                  <h2 className="text-3xl font-bold mb-4">Ready to Play?</h2>
                  <p className="text-muted-foreground text-lg mb-6">
                    Make sure your camera is connected and positioned properly. 
                    Click start to begin the gesture-controlled Snake game!
                  </p>
                </div>

                <div className="space-y-4">
                  <Button 
                    onClick={handleStartGame}
                    size="lg"
                    className="text-lg px-8 py-6 gap-3"
                  >
                    <Play className="h-5 w-5" />
                    Start Game Session
                  </Button>
                  
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>✓ Camera permission required</p>
                    <p>✓ Point in directions to control snake</p>
                    <p>✓ Calibrate gestures in settings if needed</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        ) : (
          /* Game Active State */
          <div className="grid grid-cols-1 lg:grid-cols-[700px_1fr] gap-6">
            {/* Left Column - Game Board */}
            <div className="lg:w-[700px]">
              <GameBoard preferredSize={700} />
            </div>

            {/* Right Column - Controls and Status */}
            <div className="grid grid-rows-[auto_auto] gap-6">
              <GestureController />
              <StatusPanel />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      {gameStarted && (
        <footer className="border-t border-border bg-card/50 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4 text-center text-sm text-muted-foreground">
            <p>Use hand gestures to control the snake. Access settings above to calibrate if needed.</p>
          </div>
        </footer>
      )}
    </div>
  );
}