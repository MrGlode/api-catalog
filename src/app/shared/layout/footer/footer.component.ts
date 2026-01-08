import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";

@Component({
    selector: 'app-footer',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './footer.component.html',
    styleUrl: './footer.component.scss'
})

export class FooterComponent {
    currentYear: number = new Date().getFullYear();
    companyName: string = 'MYBUSINESS S.A.';
    appVersion: string = '1.0.0';

    footerLinks = [
        { label: 'Mentions légales', url: '/legal' },
        { label: 'Politique de confidentialité', url: '/privacy' },
        { label: 'Conditions générales', url: '/terms' },
        { label: 'Contact', url: '/contact' },
        { label: 'Support', url: '/support' }
    ]
    socialLinks = [
        {
            name: 'linkedin', url: 'https://www.linkedin.com/company/MYBUSINESS/', icon: 'linkedin'
        },
        {
            name: 'twitter', url: 'https://twitter.com/MYBUSINESSGroup', icon: 'twitter'
        },
        {
            name: 'website', url: 'https://www.MYBUSINESS.com/', icon: 'public'
        }
    ];

    onLinkClick(link: any): void {
        console.log('Footer link clicked: ', link.label);
    }

    openExternal(url: string): void {
        window.open(url, '_blank', 'noopener,noreferrer');
    }
}