import { Component } from '@angular/core';

@Component({
  selector: 'app-logo',
  standalone: true,
  template: `
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.36 0H13.64C6.12 0 0 6.12 0 13.64V22.36C0 29.88 6.12 36 13.64 36H22.36C29.88 36 36 29.88 36 22.36V13.64C36 6.12 29.88 0 22.36 0Z" fill="#5E2A96"/>
      <path d="M24.2 19.02H11.8V22.48C11.8 23.9 12.92 25.02 14.34 25.02H21.66C23.08 25.02 24.2 23.9 24.2 22.48V19.02Z" fill="white"/>
      <path d="M21.68 10.98H14.32C12.9 10.98 11.78 12.1 11.78 13.52V17H24.2V13.52C24.2 12.1 23.1 10.98 21.68 10.98Z" fill="white"/>
    </svg>
  `,
})
export class LogoComponent {}
