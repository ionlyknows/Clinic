import { Head, useForm } from '@inertiajs/react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { weekdays, type WeekdayRow } from './types';

export default function AdminHours({ hours }: { hours: WeekdayRow[] }) {
    const ordered = weekdays.map(
        (_, index) =>
            hours.find((row) => row.weekday === index + 1) ?? {
                weekday: index + 1,
                is_closed: true,
                opens_at: null,
                closes_at: null,
            },
    );
    const form = useForm({ hours: ordered });
    const generalError = Object.entries(form.errors).find(
        ([key, value]) =>
            (key === 'hours' || key === 'error') && typeof value === 'string',
    )?.[1];
    return (
        <>
            <Head title="Opening hours" />
            <main className="mx-auto w-full max-w-4xl space-y-6 p-4 sm:p-6">
                <header>
                    <p className="text-base font-semibold text-teal-800">
                        Clinic configuration
                    </p>
                    <h1 className="mt-1 text-3xl font-semibold tracking-tight">
                        Opening hours
                    </h1>
                    <p className="mt-2 text-base leading-7 text-slate-700">
                        Set the weekly schedule used for online availability.
                        Times use quarter-hour increments. Saving hours that
                        affect existing active appointments will be rejected.
                    </p>
                </header>
                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        form.patch('/admin/hours', { preserveScroll: true });
                    }}
                    className="overflow-hidden rounded-xl border border-slate-200 bg-white"
                >
                    <div className="divide-y divide-slate-200">
                        {form.data.hours.map((row, index) => {
                            const timeValue = (value: string | null) =>
                                value?.slice(0, 5) ?? '';
                            const setRow = (patch: Partial<WeekdayRow>) =>
                                form.setData(
                                    'hours',
                                    form.data.hours.map((item, current) =>
                                        current === index
                                            ? {
                                                  ...item,
                                                  ...patch,
                                                  ...(patch.is_closed
                                                      ? {
                                                            opens_at: null,
                                                            closes_at: null,
                                                        }
                                                      : {}),
                                              }
                                            : item,
                                    ),
                                );
                            const openingError =
                                form.errors[
                                    `hours.${index}.opens_at` as keyof typeof form.errors
                                ];
                            const closingError =
                                form.errors[
                                    `hours.${index}.closes_at` as keyof typeof form.errors
                                ];
                            return (
                                <fieldset
                                    key={row.weekday}
                                    className="grid gap-4 p-5 sm:grid-cols-[8rem_9rem_1fr_1fr] sm:items-end"
                                >
                                    <legend className="sr-only">
                                        {weekdays[index]} hours
                                    </legend>
                                    <p className="text-lg font-semibold">
                                        {weekdays[index]}
                                    </p>
                                    <label className="flex min-h-11 items-center gap-3 text-base">
                                        <input
                                            type="checkbox"
                                            checked={!row.is_closed}
                                            onChange={(event) =>
                                                setRow({
                                                    is_closed:
                                                        !event.target.checked,
                                                })
                                            }
                                            className="size-5 accent-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
                                        />
                                        Open
                                    </label>
                                    <div className="space-y-2">
                                        <Label htmlFor={`open-${row.weekday}`}>
                                            Opens
                                        </Label>
                                        <input
                                            id={`open-${row.weekday}`}
                                            type="time"
                                            step="900"
                                            value={timeValue(row.opens_at)}
                                            onChange={(event) =>
                                                setRow({
                                                    opens_at:
                                                        event.target.value ||
                                                        null,
                                                })
                                            }
                                            disabled={row.is_closed}
                                            required={!row.is_closed}
                                            aria-invalid={!!openingError}
                                            className="h-12 w-full rounded-md border border-slate-300 bg-white px-3 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:bg-slate-100"
                                        />
                                        <InputError message={openingError} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor={`close-${row.weekday}`}>
                                            Closes
                                        </Label>
                                        <input
                                            id={`close-${row.weekday}`}
                                            type="time"
                                            step="900"
                                            value={timeValue(row.closes_at)}
                                            onChange={(event) =>
                                                setRow({
                                                    closes_at:
                                                        event.target.value ||
                                                        null,
                                                })
                                            }
                                            disabled={row.is_closed}
                                            required={!row.is_closed}
                                            aria-invalid={!!closingError}
                                            className="h-12 w-full rounded-md border border-slate-300 bg-white px-3 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:bg-slate-100"
                                        />
                                        <InputError message={closingError} />
                                    </div>
                                </fieldset>
                            );
                        })}
                    </div>
                    {typeof generalError === 'string' && (
                        <p
                            role="alert"
                            className="px-5 pt-4 text-base text-red-800"
                        >
                            {generalError}
                        </p>
                    )}
                    <div className="border-t border-slate-200 p-5">
                        <Button
                            type="submit"
                            disabled={form.processing}
                            className="h-12 bg-teal-800 px-6 text-base hover:bg-teal-900"
                        >
                            {form.processing ? 'Saving…' : 'Save opening hours'}
                        </Button>
                    </div>
                </form>
            </main>
        </>
    );
}
