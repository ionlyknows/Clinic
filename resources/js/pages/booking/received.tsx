import { Head, Link } from '@inertiajs/react';
import { CheckCircle2, Clock3 } from 'lucide-react';

export default function BookingReceived({
    reference,
}: {
    reference: string | null;
}) {
    return (
        <>
            <Head title="Request received" />
            <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 text-slate-900">
                <section
                    aria-labelledby="received-title"
                    className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10"
                >
                    {reference && (
                        <div className="flex size-14 items-center justify-center rounded-full bg-teal-50 text-teal-900">
                            <CheckCircle2 size={30} aria-hidden="true" />
                        </div>
                    )}
                    <h1
                        id="received-title"
                        className="mt-6 text-3xl font-semibold tracking-tight"
                    >
                        {reference
                            ? 'Your request has been received'
                            : 'No new request found'}
                    </h1>
                    {reference ? (
                        <>
                            <p className="mt-4 text-lg leading-7 text-slate-700">
                                Your appointment is{' '}
                                <strong className="text-slate-900">
                                    pending clinic confirmation
                                </strong>
                                . Please wait for the clinic to confirm it.
                            </p>
                            <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-5">
                                <p className="text-base font-medium text-slate-700">
                                    Reference for your records
                                </p>
                                <p className="mt-1 font-mono text-xl font-semibold tracking-wide break-all">
                                    {reference}
                                </p>
                            </div>
                            <p className="mt-5 flex gap-2 text-base text-slate-700">
                                <Clock3
                                    className="mt-1 shrink-0 text-teal-800"
                                    size={18}
                                    aria-hidden="true"
                                />{' '}
                                Keep this reference in case you need to contact
                                the clinic. It cannot be used to look up
                                appointment details.
                            </p>
                        </>
                    ) : (
                        <p className="mt-4 text-lg leading-7 text-slate-700">
                            The reference is shown only once after a successful
                            request. Return to the booking page if you still
                            need to request an appointment.
                        </p>
                    )}
                    <Link
                        href={reference ? '/' : '/book'}
                        className="mt-8 inline-flex min-h-12 items-center rounded-lg bg-teal-800 px-5 font-semibold text-white hover:bg-teal-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
                    >
                        {reference ? 'Return to clinic' : 'Go to booking'}
                    </Link>
                </section>
            </main>
        </>
    );
}
