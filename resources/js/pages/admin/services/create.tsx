import ServiceForm from './form';
import type { Service } from '../types';

export default function CreateService({
    service,
}: {
    service: Service | null;
}) {
    return <ServiceForm service={service} />;
}
