export default function ProgressBar({ value, max = 100, className = '', showLabel = false }) {
    const pct = Math.min(Math.max((value / max) * 100, 0), 100);
    return (
        <div className={`relative ${className}`}>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                    className="h-full bg-brand-orange rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${pct}%` }}
                />
            </div>
            {showLabel && (
                <span className="text-xs text-brand-muted mt-1 block text-right">
                    {Math.round(pct)}%
                </span>
            )}
        </div>
    );
}
