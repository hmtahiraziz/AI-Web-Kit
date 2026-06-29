export function TypingIndicator() {
  return (
    <div
      className="flex items-center gap-1"
      role="status"
      aria-label="Assistant is typing"
    >
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </div>
  );
}
