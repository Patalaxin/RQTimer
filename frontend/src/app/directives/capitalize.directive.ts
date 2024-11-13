import { Directive, HostListener, ElementRef } from '@angular/core';

@Directive({
  selector: '[appCapitalize]',
})
export class CapitalizeDirective {
  constructor(private el: ElementRef) {}

  @HostListener('input', ['$event'])
  onInputChange(event: Event): void {
    const input = this.el.nativeElement;
    const start = input.selectionStart;
    const end = input.selectionEnd;

    input.value = input.value.charAt(0).toUpperCase() + input.value.slice(1);
    input.setSelectionRange(start, end);
  }
}
