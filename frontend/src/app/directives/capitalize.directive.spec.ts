import { ElementRef } from '@angular/core';
import { CapitalizeDirective } from './capitalize.directive';

describe('CapitalizeDirective', () => {
  it('should create an instance', () => {
    const directive = new CapitalizeDirective(
      new ElementRef(document.createElement('input')),
    );
    expect(directive).toBeTruthy();
  });
});
