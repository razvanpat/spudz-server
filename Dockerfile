FROM centos:centos6

# Enable EPEL for Node.js
RUN     rpm -Uvh http://download.fedoraproject.org/pub/epel/6/i386/epel-release-6-8.noarch.rpm

# Install Node.js and npm
RUN     yum install -y npm

COPY . /spudz

RUN cd /spudz; npm install

EXPOSE  8001

CMD ["node", "/spudz/src/index.js"]