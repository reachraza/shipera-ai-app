'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Truck, ArrowLeft } from 'lucide-react';
import CarrierForm from '@/components/CarrierForm';
import { Button } from '@/components/ui/Button';

export default function NewCarrierPage() {
    const router = useRouter();

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.back()}
                    className="rounded-full"
                >
                    <ArrowLeft size={20} />
                </Button>
                <div>
                    <h1 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <Truck size={24} />
                        </div>
                        Register New Carrier
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm font-medium">Add a new partner to your shipping network</p>
                </div>
            </div>

            <div className="glass-panel p-6 sm:p-10 rounded-[32px] relative overflow-hidden shadow-2xl shadow-primary/5">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />
                <CarrierForm
                    onSaved={() => router.push('/carriers')}
                    onCancel={() => router.back()}
                />
            </div>
        </div>
    );
}
