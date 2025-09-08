import { GameBoard } from './GameBoard';
import { VideoPanel } from './VideoPanel';
import { StatusPanel } from './StatusPanel';
import { CalibrationPanel } from './CalibrationPanel';

export const AppShell = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Snake Game with Gesture Control
          </h1>
          <p className="text-muted-foreground mt-1">
            Control the snake using hand gestures detected by your camera
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Game Board */}
          <div className="lg:col-span-2">
            <GameBoard />
          </div>

          {/* Right Column - Controls and Status */}
          <div className="space-y-6">
            <VideoPanel />
            <StatusPanel />
            <CalibrationPanel />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 backdrop-blur-sm mt-12">
        <div className="container mx-auto px-4 py-4 text-center text-sm text-muted-foreground">
          <p>Use hand gestures to control the snake. Ensure your camera is connected and properly calibrated.</p>
        </div>
      </footer>
    </div>
  );
};