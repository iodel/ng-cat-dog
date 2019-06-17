import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { mimeType } from './mime-type.validator';

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

  constructor(private http: HttpClient) { }

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
        }
      );
  };

  onPredict = () => {

    const imageName = this.form.get('imageName');

    if (imageName.status !== 'VALID') {
      return;
    }

    this.loading = true;

    const isDog$ = this.http.get(`${this.resourceURL}/predict/${imageName.value}`)
      .pipe(
        map((res: { dog: boolean, cat: boolean }) => res.dog)
      );

    isDog$.subscribe(isDog => {
      this.loading = false;
      this.ready = true;
      this.prediction = isDog ? 'Dog' : 'Cat';
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
