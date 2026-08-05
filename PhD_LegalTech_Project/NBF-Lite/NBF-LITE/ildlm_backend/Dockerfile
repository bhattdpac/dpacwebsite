# Use an official Python runtime as a parent image
FROM python:3.9-slim

# Set the working directory in the container
WORKDIR /app

# Install build dependencies for packages that need to compile C code
RUN apt-get update && apt-get install -y gcc

# Copy the dependencies file to the working directory
COPY ./ildlm_backend/requirements.txt .

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application's code into the container
COPY ./ildlm_backend /app/ildlm_backend

# Expose the port the app runs on
EXPOSE 8000

# Define the command to run the application as a module
CMD ["uvicorn", "ildlm_backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
