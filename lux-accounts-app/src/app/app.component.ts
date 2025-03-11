import {ChangeDetectorRef, Component, DestroyRef, inject, OnInit} from '@angular/core';
import {ActivatedRoute, Params, Router, RouterOutlet} from '@angular/router';
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatIconModule} from "@angular/material/icon";
import {MatInput} from "@angular/material/input";
import {FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {filter, map, Observable, of, startWith, take, tap} from "rxjs";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {
  MatAutocomplete,
  MatAutocompleteSelectedEvent,
  MatAutocompleteTrigger,
  MatOption
} from "@angular/material/autocomplete";
import {CommonModule} from "@angular/common";
import {MatIconButton} from "@angular/material/button";

const FIELD_NAMES = {
  CLASS_DESCRIPTION: 'classDescription',
  CLASS_NUMBER: 'classNumber',
  SUBCLASS_DESCRIPTION: 'subclassDescription',
  SUBCLASS_NUMBER: 'subclassNumber',
  DESCRIPTION: 'description',
  ACCOUNT_NUMBER:'accountNumber',

} as const

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, MatFormFieldModule, MatIconModule, MatInput, ReactiveFormsModule, MatAutocomplete, MatAutocompleteTrigger, MatOption, MatIconButton],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  public accountsFilterForm: FormGroup;
  public formControlName = FIELD_NAMES;

  classControl = new FormControl('');
  searchControl = new FormControl('');
  subClassControl = new FormControl('');

  classOptions: string[] = ['CLASS_1', 'CLASS_2', 'CLASS_3', 'CLASS_4', 'CLASS_5', 'CLASS_6', 'CLASS_7'];
  subclassOptionsMap: Map<string, string[]> = new Map();
  subclassOptions: string[] = [];
  searchOptions: string[] = [];

  filteredClassOptions!: Observable<string[]>;
  filteredSubClassOptions!: Observable<string[]>;
  filteredSearchResults!: Observable<string[]>;

  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);

  constructor(){
    this.accountsFilterForm = this.fb.group({
      [FIELD_NAMES.CLASS_DESCRIPTION]: [null],
      [FIELD_NAMES.SUBCLASS_DESCRIPTION]: [null],
      [FIELD_NAMES.DESCRIPTION]: [null],
      [FIELD_NAMES.ACCOUNT_NUMBER]: [null],
      [FIELD_NAMES.CLASS_NUMBER]: [null],
      [FIELD_NAMES.SUBCLASS_NUMBER]: [null],
    });

    this.subclassOptionsMap.set('CLASS_1',['SUBCLASS_11', 'SUBCLASS_12', 'SUBCLASS_13']);
    this.subclassOptionsMap.set('CLASS_2',['SUBCLASS_21', 'SUBCLASS_22', 'SUBCLASS_23']);
    this.subclassOptionsMap.set('CLASS_3',['SUBCLASS_31', 'SUBCLASS_32', 'SUBCLASS_33']);
    this.subclassOptionsMap.set('CLASS_4',['SUBCLASS_41', 'SUBCLASS_42', 'SUBCLASS_43']);
    this.subclassOptionsMap.set('CLASS_5',['SUBCLASS_51', 'SUBCLASS_52', 'SUBCLASS_53']);
    this.subclassOptionsMap.set('CLASS_6',['SUBCLASS_61', 'SUBCLASS_62', 'SUBCLASS_63']);
    this.subclassOptionsMap.set('CLASS_7',['SUBCLASS_71', 'SUBCLASS_72', 'SUBCLASS_73']);
  }

  ngOnInit(): void {

    this.activatedRoute.queryParams.pipe(
      filter(Boolean),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((p:Params) => this.accountsFilterForm.patchValue(p))

    this.accountsFilterForm
      .valueChanges
      .pipe(
        filter(Boolean),
        takeUntilDestroyed(this.destroyRef))
      .subscribe(accounts => {this._applyParamsToData(accounts)});

    this.filteredSearchResults = this.searchControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(this.searchOptions,value || '')),
    );

    this.filteredClassOptions = this.classControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(this.classOptions,value || '')),
    );

    this.filteredSubClassOptions = this.subClassControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(this.subclassOptions,value || '')),
      tap((subClassOptions) => {console.log(subClassOptions,"tap")}),
    );

    this.initSubClassOptions()
    // this.subclassOptions$ = this.accountsFilterForm.get(FIELD_NAMES.CLASS_DESCRIPTION)?.valueChanges
    //   .pipe(
    //   map(selectedClass => {
    //   return this.subclassOptions.get(selectedClass) ?? [];
    // }))
  }

  displaySubClassFn(): string {
    return this.accountsFilterForm?.get(FIELD_NAMES.SUBCLASS_DESCRIPTION)?.value ?? '';
  }

  displayClassFn(value: string): string {

    return value;
    // return this.accountsFilterForm?.get(FIELD_NAMES.CLASS_DESCRIPTION)?.value ?? '';
  }

  clearFormField(fieldName: string, emitEvent: boolean = true): void {
    this.accountsFilterForm.get(fieldName)?.setValue(null,{emitEvent});
  }

  getFormFieldValue(fieldName: string): string | null {
    return this.accountsFilterForm.get(fieldName)?.value;
  }

  public onClassSelection(selectClassEvent: MatAutocompleteSelectedEvent): void {
    console.log('matAutoCompleteEv', selectClassEvent.option.value)
    this.accountsFilterForm.get(FIELD_NAMES.CLASS_DESCRIPTION)?.setValue(selectClassEvent.option.value)
    this.subclassOptions = this.subclassOptionsMap.get(selectClassEvent.option.value) ?? [];
    this.subClassControl.setValue('');
    console.log( this.subclassOptions)
    this.cdr.markForCheck();
  }

  public onSubClassSelection(selectClassEvent: MatAutocompleteSelectedEvent): void {
    console.log('matAutoCompleteEv', selectClassEvent.option.value);
    this.accountsFilterForm.get(FIELD_NAMES.SUBCLASS_DESCRIPTION)?.setValue(selectClassEvent.option.value);
    this.accountsFilterForm.get(FIELD_NAMES.CLASS_DESCRIPTION)
      ?.setValue(this.getClassFromSubClassDefinition(selectClassEvent.option.value));
    this.classControl.setValue('');
    // this.subclassOptions = this.subclassOptionsMap.get(selectClassEvent.option.value) ?? [];
    console.log( this.subclassOptions)
  }

  private getClassFromSubClassDefinition(subclassName: string): string {
    let resultClassname='';
    this.subclassOptionsMap.forEach((subClasses, className) => {
      if(subClasses.includes(subclassName)) {
        resultClassname = className;
      }
    })
    return resultClassname;
  }

  private _filter(source: string[],value: string): string[] {
    const filterValue = value.toLowerCase();

    return source.filter(option => option.toLowerCase().includes(filterValue));
  }

  private initSubClassOptions() {
    const classSelected = this.accountsFilterForm.get(FIELD_NAMES.CLASS_DESCRIPTION)?.value;
    if (classSelected) {
      this.subclassOptions = this.subclassOptionsMap.get(classSelected) ?? [];
    } else {
      let allSubClassOptions: any[] = []
      for (let value of this.subclassOptionsMap.values()) {
        allSubClassOptions = [...allSubClassOptions, ...value];
      }
      this.subclassOptions = allSubClassOptions;
    }
  }

  private _applyParamsToData(value: Params): void {
    this.router.navigate(['.'], {
      queryParams: value,
      relativeTo: this.activatedRoute,
    });
    this.cdr.markForCheck();
  }
}
