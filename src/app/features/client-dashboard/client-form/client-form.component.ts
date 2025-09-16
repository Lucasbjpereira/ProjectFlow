import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Client } from '../../../core/models';

@Component({
  selector: 'app-client-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './client-form.component.html',
  styleUrls: ['./client-form.component.scss']
})
export class ClientFormComponent implements OnInit, OnChanges {
  @Input() client: Client | null = null;
  @Output() save = new EventEmitter<Partial<Client>>();
  @Output() close = new EventEmitter<void>();

  form: FormGroup;
  isEditMode = false;
  imagePreview: string | ArrayBuffer | null = null;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      address: [''],
      contactPerson: [''],
      status: ['active', Validators.required],
      imageUrl: ['']
    });
  }

  ngOnInit(): void {
    this.updateForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['client']) {
      this.isEditMode = !!this.client;
      this.updateForm();
    }
  }

  private updateForm(): void {
    if (this.client) {
      this.form.patchValue(this.client);
      if (this.client.imageUrl) {
        this.imagePreview = this.client.imageUrl;
      } else {
        this.imagePreview = null;
      }
    } else {
      this.form.reset({ status: 'active', imageUrl: '' });
      this.imagePreview = null;
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result;
        this.form.patchValue({ imageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  }

  onUrlInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const url = input.value;
    if (url) {
      this.imagePreview = url;
    }
  }

  onSubmit(): void {
    if (this.form.valid) {
      this.save.emit(this.form.value);
    }
  }

  onClose(): void {
    this.close.emit();
  }
}
