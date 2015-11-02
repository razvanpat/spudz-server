FROM centos:centos7.1.1503

RUN yum install -y wget tar gcc gcc-c++ make
WORKDIR /tmp
RUN wget https://nodejs.org/dist/v4.2.1/node-v4.2.1.tar.gz
RUN tar xvf node-v4.2.1.tar.gz
WORKDIR /tmp/node-v4.2.1
RUN ls
RUN ./configure 
RUN  make
RUN  make install

RUN node --version

COPY . /spudz

RUN cd /spudz; npm install

EXPOSE  8001

CMD ["node", "/spudz/src/index.js"]
