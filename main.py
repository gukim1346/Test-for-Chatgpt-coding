from flask import Flask

app = Flask(__name__, static_folder='.', static_url_path='')


@app.route('/')
def root():
    """Serve the NovaLaunch landing page."""
    return app.send_static_file('index.html')


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080, debug=False)
