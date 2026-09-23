import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, File, X, CheckCircle, Lock } from 'lucide-react';

const FILE_TYPES = ['PDF', 'PPTX', 'TXT'];

function formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileDropzone({ onFileChange, file, disabled = false }) {
    const [isDragging, setIsDragging] = useState(false);

    const handleDragOver = useCallback((e) => {
        if (disabled) return;
        e.preventDefault();
        setIsDragging(true);
    }, [disabled]);

    const handleDragLeave = useCallback(() => {
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback(
        (e) => {
            if (disabled) return;
            e.preventDefault();
            setIsDragging(false);
            const dropped = e.dataTransfer.files[0];
            if (dropped) onFileChange(dropped);
        },
        [onFileChange, disabled]
    );

    const handleInput = (e) => {
        if (disabled) return;
        const selected = e.target.files[0];
        if (selected) onFileChange(selected);
    };

    const handleRemove = (e) => {
        if (disabled) return;
        e.stopPropagation();
        onFileChange(null);
    };

    return (
        <div className={`relative transition-opacity duration-300 ${disabled ? 'opacity-50' : ''}`}>
            <AnimatePresence mode="wait">
                {!file ? (
                    <motion.label
                        key="empty"
                        htmlFor={disabled ? undefined : 'file-input'}
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.25 }}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`drop-zone flex flex-col items-center justify-center gap-4 p-10 min-h-[220px] ${disabled
                                ? 'cursor-not-allowed'
                                : `cursor-pointer ${isDragging ? 'active' : ''}`
                            }`}
                    >
                        <motion.div
                            animate={isDragging && !disabled ? { scale: 1.15 } : { scale: 1 }}
                            transition={{ type: 'spring', stiffness: 300 }}
                            className="relative"
                        >
                            <div className="w-16 h-16 rounded-2xl bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center">
                                {disabled ? (
                                    <Lock className="w-7 h-7 text-brand-muted" />
                                ) : (
                                    <Upload
                                        className={`w-7 h-7 transition-colors duration-200 ${isDragging ? 'text-brand-orange' : 'text-brand-muted'}`}
                                    />
                                )}
                            </div>
                            {isDragging && !disabled && (
                                <motion.div
                                    initial={{ scale: 1.2, opacity: 0 }}
                                    animate={{ scale: 1.6, opacity: 0 }}
                                    transition={{ duration: 0.6, repeat: Infinity }}
                                    className="absolute inset-0 rounded-2xl border border-brand-orange/40"
                                />
                            )}
                        </motion.div>

                        <div className="text-center">
                            <p className="text-brand-text font-medium mb-1">
                                {disabled ? 'Processing…' : isDragging ? 'Drop it here!' : 'Drop your file here'}
                            </p>
                            {!disabled && (
                                <p className="text-brand-muted text-sm">
                                    or{' '}
                                    <span className="text-brand-orange hover:underline cursor-pointer">
                                        click to browse
                                    </span>
                                </p>
                            )}
                        </div>

                        {/* Format badges */}
                        <div className="flex items-center gap-2 flex-wrap justify-center">
                            {FILE_TYPES.map((type) => (
                                <span
                                    key={type}
                                    className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-brand-muted"
                                >
                                    .{type.toLowerCase()}
                                </span>
                            ))}
                        </div>

                        <input
                            id="file-input"
                            type="file"
                            accept=".pdf,.pptx,.txt"
                            className="hidden"
                            onChange={handleInput}
                            disabled={disabled}
                        />
                    </motion.label>
                ) : (
                    <motion.div
                        key="filled"
                        initial={{ opacity: 0, y: 10, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        className="card p-6 flex items-center gap-4"
                    >
                        <div className="w-12 h-12 rounded-xl bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center flex-shrink-0">
                            <File className="w-6 h-6 text-brand-orange" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-brand-text font-medium text-sm truncate">{file.name}</p>
                            <p className="text-brand-muted text-xs mt-0.5">{formatSize(file.size)}</p>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                            <CheckCircle className="w-5 h-5 text-green-400" />
                            {!disabled && (
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleRemove}
                                    className="p-1.5 rounded-lg hover:bg-white/10 text-brand-muted hover:text-brand-text transition-colors duration-200"
                                    aria-label="Remove file"
                                >
                                    <X className="w-4 h-4" />
                                </motion.button>
                            )}
                            {disabled && (
                                <Lock className="w-4 h-4 text-brand-mutedDark" />
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
