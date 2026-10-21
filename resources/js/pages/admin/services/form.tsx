import { Head, Link, useForm } from '@inertiajs/react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Service } from '../types';

export default function ServiceForm({ service }: { service: Service | null }) {
    const form = useForm({
        name: service?.name ?? '',
        description: service?.description ?? '',
        duration_minutes: String(service?.duration_minutes ?? 30),
        fee: service?.fee == null ? '' : String(service.fee),
        is_active: service?.is_active ?? true,
    });
    const errors = form.errors;
    const generalError = Object.values(errors).find(
        (value): value is string => typeof value === 'string',
    );
    const action = service
        ? `/admin/services/${service.id}`
        : '/admin/services';
    return (
        <>
            <Head title={service ? 'Edit service' : 'Add service'} />
            <main className="mx-auto w-full max-w-3xl space-y-6 p-4 sm:p-6">
                <header>
                    <Link
                        href="/admin/services"
                        className="text-base font-medium text-teal-900 underline underline-offset-2"
                    >
                        ← Services
                    </Link>
                    <p className="mt-5 text-base font-semibold text-teal-800">
                        Clinic configuration
                    </p>
                    <h1 className="mt-1 text-3xl font-semibold tracking-tight">
                        {service ? 'Edit service' : 'Add a service'}
                    </h1>
                    <p className="mt-2 text-base text-slate-700">
                        Duration must use 15-minute increments. Existing
                        appointment details will not change.
                    </p>
                </header>
                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        if (service) {
                            form.patch(action, { preserveScroll: true });
                        } else {
                            form.post(action, { preserveScroll: true });
                        }
                    }}
                    className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 sm:p-7"
                >
                    <div className="space-y-2">
                        <Label htmlFor="name">Service name</Label>
                        <Input
                            id="name"
                            required
                            maxLength={120}
                            value={form.data.name}
                            onChange={(event) =>
                                form.setData('name', event.target.value)
                            }
                            aria-invalid={!!errors.name}
                            aria-describedby={
                                errors.name ? 'name-error' : undefined
                            }
                            className="h-12"
                        />
                        <InputError id="name-error" message={errors.name} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">
                            Description{' '}
                            <span className="font-normal text-slate-600">
                                (optional)
                            </span>
                        </Label>
                        <textarea
                            id="description"
                            rows={4}
                            maxLength={1000}
                            value={form.data.description}
                            onChange={(event) =>
                                form.setData('description', event.target.value)
                            }
                            aria-invalid={!!errors.description}
                            aria-describedby={
                                errors.description
                                    ? 'description-error'
                                    : undefined
                            }
                            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
                        />
                        <InputError
                            id="description-error"
                            message={errors.description}
                        />
                    </div>
                    <div className="grid gap-5 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="duration_minutes">
                                Duration (minutes)
                            </Label>
                            <Input
                                id="duration_minutes"
                                type="number"
                                min="15"
                                step="15"
                                required
                                value={form.data.duration_minutes}
                                onChange={(event) =>
                                    form.setData(
                                        'duration_minutes',
                                        event.target.value,
                                    )
                                }
                                aria-invalid={!!errors.duration_minutes}
                                aria-describedby={
                                    errors.duration_minutes
                                        ? 'duration-error'
                                        : undefined
                                }
                                className="h-12"
                            />
                            <p className="text-base text-slate-700">
                                Use 15, 30, 45, or another multiple of 15.
                            </p>
                            <InputError
                                id="duration-error"
                                message={errors.duration_minutes}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="fee">
                                Fee in PHP{' '}
                                <span className="font-normal text-slate-600">
                                    (optional)
                                </span>
                            </Label>
                            <Input
                                id="fee"
                                type="number"
                                min="0"
                                step="0.01"
                                value={form.data.fee}
                                onChange={(event) =>
                                    form.setData('fee', event.target.value)
                                }
                                aria-invalid={!!errors.fee}
                                aria-describedby={
                                    errors.fee ? 'fee-error' : undefined
                                }
                                className="h-12"
                            />
                            <InputError id="fee-error" message={errors.fee} />
                        </div>
                    </div>
                    <label className="flex min-h-11 items-center gap-3 text-base">
                        <input
                            type="checkbox"
                            checked={form.data.is_active}
                            onChange={(event) =>
                                form.setData('is_active', event.target.checked)
                            }
                            className="size-5 accent-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
                        />
                        Available for new online bookings
                    </label>
                    {generalError && (
                        <p role="alert" className="text-base text-red-800">
                            {generalError}
                        </p>
                    )}
                    <div className="flex flex-wrap gap-3 border-t border-slate-200 pt-5">
                        <Button
                            type="submit"
                            disabled={form.processing}
                            className="h-12 bg-teal-800 px-6 text-base hover:bg-teal-900"
                        >
                            {form.processing ? 'Saving…' : 'Save service'}
                        </Button>
                        <Link
                            href="/admin/services"
                            className="inline-flex min-h-12 items-center rounded-md border border-slate-300 px-5 font-medium hover:bg-slate-50"
                        >
                            Cancel
                        </Link>
                    </div>
                </form>
            </main>
        </>
    );
}
