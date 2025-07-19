#!/bin/bash
concurrently "npm run start-backend" "npm run start-frontend"