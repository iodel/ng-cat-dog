import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { mimeType } from './mime-type.validator';
import { VerifyUploadComponent } from './verify-upload/verify-upload.component';
import { MatSnackBar } from '@angular/material';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  ready = false;
  uploaded = false;
  imageChanged = false;
  loading = false;
  prediction: string;
  form: FormGroup;
  imagePreview: any;
  resourceURL = 'http://localhost:5000/api/pet';
  durationInSeconds = 2;
  probability: number;

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit() {
    this.form = new FormGroup({
      imageName: new FormControl(null, {
        validators: [
          Validators.required
        ]
      }),
      image: new FormControl(null, {
        validators: [
          Validators.required
        ],
        asyncValidators: [
          mimeType
        ]
      })
    });
  }

  onSubmit = (imageName: string, image: File) => {

    if (!imageName || imageName.length === 0) {
      return;
    }

    const imageData = new FormData();
    imageData.append('image', image, imageName);

    this.http.post(`${this.resourceURL}/upload`, imageData)
      .subscribe(
        res => {
          this.uploaded = true;
          this.snackBar.openFromComponent(VerifyUploadComponent, {
            duration: this.durationInSeconds * 1000,
          });
        }
      );
  };

  onPredict = () => {

    const imageName = this.form.get('imageName');

    if (imageName.status !== 'VALID') {
      return;
    }

    this.loading = true;

    const isDog$ = this.http.get(`${this.resourceURL}/predict/${imageName.value}`);

    isDog$.subscribe((res: { dog: number, cat: number, image: string }) => {
      this.loading = false;
      this.ready = true;
      this.prediction = res.dog >= 0.5 ? 'Dog' : 'Cat';
      this.probability = Math.max(res.dog, res.cat);
    });
  };

  onImagePicked = (event: Event) => {
    const file = (event.target as HTMLInputElement).files[0];
    this.form.patchValue({ image: file });
    this.form.get('image').updateValueAndValidity();
    const fileReader = new FileReader();
    fileReader.onload = () => {
      this.imagePreview = fileReader.result;
      this.imageChanged = true;
    };
    fileReader.readAsDataURL(file);
  };

}
