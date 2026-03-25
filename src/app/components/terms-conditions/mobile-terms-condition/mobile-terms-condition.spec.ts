import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MobileTermsCondition } from './mobile-terms-condition';

describe('MobileTermsCondition', () => {
  let component: MobileTermsCondition;
  let fixture: ComponentFixture<MobileTermsCondition>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MobileTermsCondition]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MobileTermsCondition);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
