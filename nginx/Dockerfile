FROM nginx:alpine

# Remove the default nginx config that serves "Welcome to nginx!"
RUN rm -f /etc/nginx/conf.d/default.conf

# Copy our custom reverse proxy config
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
