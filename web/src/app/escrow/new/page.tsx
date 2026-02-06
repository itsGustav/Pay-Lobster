'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

type Step = 'details' | 'amount' | 'review';

export default function NewEscrowPage() {
  const { isConnected } = useAccount();
  const [step, setStep] = useState<Step>('details');
  const [formData, setFormData] = useState({
    recipientAddress: '',
    description: '',
    amount: '',
  });

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md w-full text-center space-y-4">
          <div className="text-5xl">🦞</div>
          <h1 className="text-2xl font-bold">Connect Your Wallet</h1>
          <p className="text-gray-400">
            Connect your wallet to create an escrow
          </p>
        </Card>
      </div>
    );
  }

  const steps: { id: Step; label: string; number: number }[] = [
    { id: 'details', label: 'Details', number: 1 },
    { id: 'amount', label: 'Amount', number: 2 },
    { id: 'review', label: 'Review', number: 3 },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === step);

  return (
    <div className="min-h-screen py-16 md:py-24 px-4 md:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-2xl md:text-4xl font-bold mb-4">
            Create Escrow
          </h1>
          <p className="text-lg md:text-xl text-gray-400">
            Secure USDC payment with trustless escrow
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((s, idx) => (
              <div key={s.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
                      idx <= currentStepIndex
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-800 text-gray-400'
                    }`}
                  >
                    {s.number}
                  </div>
                  <span
                    className={`text-sm mt-2 ${
                      idx <= currentStepIndex ? 'text-gray-50' : 'text-gray-400'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 transition-colors ${
                      idx < currentStepIndex ? 'bg-orange-600' : 'bg-gray-800'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <Card>
          {/* Step 1: Details */}
          {step === 'details' && (
            <div className="space-y-6">
              <Input
                label="Recipient Address"
                placeholder="0x..."
                value={formData.recipientAddress}
                onChange={(e) =>
                  setFormData({ ...formData, recipientAddress: e.target.value })
                }
                required
              />
              <Input
                label="Description"
                placeholder="What is this escrow for?"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                required
              />
              <Button
                size="lg"
                className="w-full"
                onClick={() => setStep('amount')}
                disabled={!formData.recipientAddress || !formData.description}
              >
                Next →
              </Button>
            </div>
          )}

          {/* Step 2: Amount */}
          {step === 'amount' && (
            <div className="space-y-6">
              <Input
                label="Amount (USDC)"
                type="number"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                required
              />
              <div className="text-sm text-gray-400 space-y-2">
                <p>💰 Platform fee: 0.5%</p>
                <p>
                  Total:{' '}
                  {formData.amount
                    ? (parseFloat(formData.amount) * 1.005).toFixed(2)
                    : '0.00'}{' '}
                  USDC
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  size="lg"
                  className="flex-1"
                  onClick={() => setStep('details')}
                >
                  ← Back
                </Button>
                <Button
                  size="lg"
                  className="flex-1"
                  onClick={() => setStep('review')}
                  disabled={!formData.amount || parseFloat(formData.amount) <= 0}
                >
                  Next →
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 'review' && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-400 mb-1">Recipient</div>
                  <div className="font-mono text-sm">{formData.recipientAddress}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400 mb-1">Description</div>
                  <div>{formData.description}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400 mb-1">Amount</div>
                  <div className="text-2xl font-bold">{formData.amount} USDC</div>
                </div>
                <div className="pt-4 border-t border-gray-800">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Platform fee (0.5%)</span>
                    <span>{(parseFloat(formData.amount) * 0.005).toFixed(2)} USDC</span>
                  </div>
                  <div className="flex justify-between font-bold mt-2">
                    <span>Total</span>
                    <span>{(parseFloat(formData.amount) * 1.005).toFixed(2)} USDC</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  size="lg"
                  className="flex-1"
                  onClick={() => setStep('amount')}
                >
                  ← Back
                </Button>
                <Button
                  size="lg"
                  className="flex-1"
                  onClick={() => alert('Escrow created! (Demo)')}
                >
                  Create Escrow
                </Button>
              </div>

              <div className="text-sm text-gray-400 space-y-1">
                <p>✅ Funds held in smart contract</p>
                <p>✅ Release when work is complete</p>
                <p>✅ Dispute resolution available</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
