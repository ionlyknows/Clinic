import ServiceForm from './form';
import type { Service } from '../types';

export default function EditService({ service }: { service: Service }) {
    return <ServiceForm service={service} />;
}
