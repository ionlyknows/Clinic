import { Head, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';

type Closure = { id: number; closed_on: string; reason: string | null };
function ClosureRow({ closure }: { closure: Closure }) {
    const form = useForm({});
    return (
        <li className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 last:border-0 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <p className="font-semibold">{closure.closed_on}</p>
                <p className="mt-1 text-base text-slate-700">
                    {closure.reason || 'Clinic closed'}
                </p>
                {Object.values(form.errors)
                    .filter(
                        (error): error is string => typeof error === 'string',
                    )
                    .map((error, index) => (
                        <p
                            key={index}
                            role="alert"
                            className="text-base text-red-800"
                        >
                            {error}
                        </p>
                    ))}
            </div>
            <Button
                type="button"
                variant="outline"
                className="h-11 w-fit"
                disabled={form.processing}
                onClick={() => {
                    if (
                        window.confirm(
                            `Remove the closure for ${closure.closed_on}?`,
                        )
                    )
                        form.delete(`/admin/closures/${closure.id}`, {
                            preserveScroll: true,
                        });
                }}
            >
                {form.processing ? 'Removing…' : 'Remove closure'}
            </Button>
        </li>
    );
}

export default function Closures({ closures }: { closures: Closure[] }) {
    const form = useForm({ closed_on: '', reason: '' });
    const generalError = Object.entries(form.errors).find(
        ([key, value]) => key === 'error' && typeof value === 'string',
    )?.[1];
    return (
        <>
            <Head title="Closure dates" />
            <main className="mx-auto w-full max-w-4xl space-y-6 p-4 sm:p-6">
                <header>
                    <p className="text-base font-semibold text-teal-800">
                        Clinic configuration
                    </p>
                    <h1 className="mt-1 text-3xl font-semibold tracking-tight">
                        Closure dates
                    </h1>
                    <p className="mt-2 text-base leading-7 text-slate-700">
                        A closure blocks new appointments for the full date. The
                        clinic cannot add a closure while active appointments
                        remain on that day.
                    </p>
                </header>
                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        form.post('/admin/closures', {
                            preserveScroll: true,
                            onSuccess: () => form.reset(),
                        });
                    }}
                    className="grid gap-5 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-[1fr_1.5fr_auto] sm:items-end"
                >
                    <div className="space-y-2">
                        <Label htmlFor="closed_on">Closed date</Label>
                        <Input
                            id="closed_on"
                            type="date"
                            required
                            value={form.data.closed_on}
                            onChange={(event) =>
                                form.setData('closed_on', event.target.value)
                            }
                            aria-invalid={!!form.errors.closed_on}
                            aria-describedby={
                                form.errors.closed_on
                                    ? 'closed_on-error'
                                    : undefined
                            }
                            className="h-12"
                        />
                        <InputError
                            id="closed_on-error"
                            message={form.errors.closed_on}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="reason">
                            Reason{' '}
                            <span className="font-normal text-slate-600">
                                (optional)
                            </span>
                        </Label>
                        <Input
                            id="reason"
                            maxLength={160}
                            value={form.data.reason}
                            onChange={(event) =>
                                form.setData('reason', event.target.value)
                            }
                            aria-invalid={!!form.errors.reason}
                            aria-describedby={
                                form.errors.reason ? 'reason-error' : undefined
                            }
                            className="h-12"
                        />
                        <InputError
                            id="reason-error"
                            message={form.errors.reason}
                        />
                    </div>
                    <Button
                        type="submit"
                        disabled={form.processing}
                        className="h-12 bg-teal-800 hover:bg-teal-900"
                    >
                        {form.processing ? 'Saving…' : 'Add closure'}
                    </Button>
                    {typeof generalError === 'string' && (
                        <p
                            role="alert"
                            className="text-base text-red-800 sm:col-span-3"
                        >
                            {generalError}
                        </p>
                    )}
                </form>
                <section
                    aria-labelledby="closures-title"
                    className="overflow-hidden rounded-xl border border-slate-200 bg-white"
                >
                    <h2
                        id="closures-title"
                        className="border-b border-slate-200 px-5 py-4 text-xl font-semibold"
                    >
                        Scheduled closures
                    </h2>
                    {closures.length ? (
                        <ul>
                            {closures.map((closure) => (
                                <ClosureRow
                                    key={closure.id}
                                    closure={closure}
                                />
                            ))}
                        </ul>
                    ) : (
                        <p className="p-6 text-base text-slate-700">
                            No closure dates have been added.
                        </p>
                    )}
                </section>
            </main>
        </>
    );
}
