'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    totalItems?: number;
    itemsPerPage?: number;
}

export default function Pagination({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage }: PaginationProps) {
    if (totalPages <= 1) return null;

    // Build page number array with ellipsis logic
    const getPageNumbers = (): (number | '...')[] => {
        const pages: (number | '...')[] = [];

        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (currentPage > 3) pages.push('...');

            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);
            for (let i = start; i <= end; i++) pages.push(i);

            if (currentPage < totalPages - 2) pages.push('...');
            pages.push(totalPages);
        }

        return pages;
    };

    const startItem = totalItems ? (currentPage - 1) * (itemsPerPage || 10) + 1 : null;
    const endItem = totalItems ? Math.min(currentPage * (itemsPerPage || 10), totalItems) : null;

    return (
        <div className="flex items-center justify-between px-2 py-4 border-t border-border mt-2">
            {/* Item count */}
            <div className="text-xs text-muted-foreground font-medium">
                {totalItems != null ? (
                    <span>
                        Showing <span className="font-bold text-foreground">{startItem}–{endItem}</span> of{' '}
                        <span className="font-bold text-foreground">{totalItems}</span>
                    </span>
                ) : (
                    <span>
                        Page <span className="font-bold text-foreground">{currentPage}</span> of{' '}
                        <span className="font-bold text-foreground">{totalPages}</span>
                    </span>
                )}
            </div>

            {/* Page controls */}
            <div className="flex items-center gap-1">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="inline-flex items-center justify-center w-9 h-9 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-all"
                    title="Previous page"
                >
                    <ChevronLeft size={16} />
                </button>

                {getPageNumbers().map((page, idx) =>
                    page === '...' ? (
                        <span key={`ellipsis-${idx}`} className="w-9 h-9 flex items-center justify-center text-muted-foreground text-xs">
                            ···
                        </span>
                    ) : (
                        <button
                            key={page}
                            onClick={() => onPageChange(page)}
                            className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${page === currentPage
                                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                }`}
                        >
                            {page}
                        </button>
                    )
                )}

                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="inline-flex items-center justify-center w-9 h-9 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-all"
                    title="Next page"
                >
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
}
