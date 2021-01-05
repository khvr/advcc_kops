FROM wurstmeister/kafka
RUN mkdir -p /root/prometheus
ADD https://raw.githubusercontent.com/prometheus/jmx_exporter/master/example_configs/kafka-0-8-2.yml /root/prometheus/kafka-0-8-2.yml
ADD https://repo1.maven.org/maven2/io/prometheus/jmx/jmx_prometheus_javaagent/0.13.0/jmx_prometheus_javaagent-0.13.0.jar /root/prometheus/jmx_prometheus_javaagent-0.13.0.jar