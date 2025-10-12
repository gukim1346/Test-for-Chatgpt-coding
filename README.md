# NovaLaunch Frontend

This repository contains the frontend for the fictional NovaLaunch product
launch platform. The experience is built with vanilla HTML, CSS, and
JavaScript, and can be served statically or through the lightweight Flask
wrapper included for Google Cloud deployment.

## Local Development

1. (Optional) Create and activate a virtual environment.
2. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

3. Start the development server:

   ```bash
   python main.py
   ```

4. Open <http://localhost:8080> in your browser to explore the interface.

You can also serve the site with any static file server if you do not need the
Flask wrapper.

## Deploying to Google Cloud

The project is ready to deploy to Google App Engine Standard Environment and
also includes a container recipe for Cloud Build or Cloud Run workflows.

1. Install and initialize the [Google Cloud CLI](https://cloud.google.com/sdk/docs/install).
2. Authenticate with your Google Cloud project:

   ```bash
   gcloud auth login
   gcloud config set project <YOUR_PROJECT_ID>
   ```

3. Deploy the application from the repository root:

   ```bash
   gcloud app deploy
   ```

   The included `.gcloudignore` keeps typical local-only folders—such as
   virtual environments or build artifacts—from being uploaded during
   deployment. Update it if your workflow creates additional files that should
   stay out of the App Engine build.

4. Open the deployed site:

   ```bash
   gcloud app browse
   ```

App Engine uses the provided `app.yaml` configuration, `main.py` Flask
application, and `requirements.txt` for dependency management.

### Deploying with Cloud Build / Cloud Run

If you prefer to deploy with Cloud Build (for example, to Cloud Run), use the
included `Dockerfile`:

```bash
gcloud builds submit --tag gcr.io/<YOUR_PROJECT_ID>/novalaunch
gcloud run deploy novalaunch \
  --image gcr.io/<YOUR_PROJECT_ID>/novalaunch \
  --platform managed \
  --region <YOUR_REGION>
```

The Docker image runs the Flask application with Gunicorn bound to port 8080,
which matches Cloud Run's default expectations and is compatible with other
container hosting options on Google Cloud.

## Features

- Responsive layout with a sticky navigation bar and mobile menu toggle.
- Hero section with launch statistics and animated background accents.
- Feature highlights, workflow showcase, testimonials, metrics, and pricing
  sections.
- Newsletter subscription call-to-action and footer with quick links.
- Scroll-triggered reveal animations with reduced-motion accessibility support.

## Project Structure

```
├── app.yaml         # App Engine deployment configuration
├── index.html       # Main page markup
├── main.py          # Flask wrapper used for serving the site
├── requirements.txt # Python dependencies for deployment
├── script.js        # Interactive behaviors (navigation, animations, footer year)
└── styles.css       # Global styles and responsive design
```

Feel free to customize the content and styling to match your product branding.
