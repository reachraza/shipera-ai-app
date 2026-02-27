'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Truck, ArrowLeft, Loader2 } from 'lucide-react';
import CarrierForm from '@/components/CarrierForm';
import { Button } from '@/components/ui/Button';
import { Carrier } from '@/constants/types';
import { getCarrier } from '@/services/carrierService';

export default function EditCarrierPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    const [carrier, setCarrier] = useState<Carrier | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchCarrier() {
            try {
                const data = await getCarrier(id);
                setCarrier(data);
            } catch (error) {
                console.error('Error fetching carrier:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchCarrier();
    }, [id]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-muted-foreground font-medium">Loading carrier details...</p>
            </div>
        );
    }

    if (!carrier) {
        return (
            <div className="text-center space-y-4 py-20">
                <h2 className="text-2xl font-bold">Carrier not found</h2>
                <Button onClick={() => router.push('/carriers')}>Return to Network</Button>
            </div>
        );
    }

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
                        Edit Carrier Profile
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm font-medium">Update compliance and partner information</p>
                </div>
            </div>

            <div className="glass-panel p-6 sm:p-10 rounded-[32px] relative overflow-hidden shadow-2xl shadow-primary/5">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />
                <CarrierForm
                    carrier={carrier}
                    onSaved={() => router.push('/carriers')}
                    onCancel={() => router.back()}
                />
            </div>
        </div>
    );
}
