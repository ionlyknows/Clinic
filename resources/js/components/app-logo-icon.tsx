import type { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg {...props} viewBox="0 0 40 42" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 4h10v11h11v10H25v11H15V25H4V15h11V4Z" />
        </svg>
    );
}
