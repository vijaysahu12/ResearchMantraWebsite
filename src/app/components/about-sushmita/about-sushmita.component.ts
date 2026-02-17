import { Component, ChangeDetectionStrategy } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';

@Component({
    selector: 'app-about-sushmita',
    imports: [NgOptimizedImage],
    templateUrl: './about-sushmita.component.html',
    styleUrl: './about-sushmita.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AboutSushmitaComponent { }
