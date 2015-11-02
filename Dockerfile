FROM centos:centos7.1.1503

# Enable EPEL for Node.js
RUN 		yum install epel-release

# Install Node.js and npm
RUN     yum install -y npm

COPY . /spudz

RUN cd /spudz; npm install

EXPOSE  8001

CMD ["node", "/spudz/src/index.js"]