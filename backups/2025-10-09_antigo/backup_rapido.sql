-- Backup rápido do banco de dados
-- Data: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

-- Empresas
COPY empresas TO STDOUT WITH CSV HEADER;

-- Produtos  
COPY produtos TO STDOUT WITH CSV HEADER;

-- Participantes
COPY participantes TO STDOUT WITH CSV HEADER;

-- Reuniões
COPY reunioes TO STDOUT WITH CSV HEADER;

-- Relações
COPY reuniao_participantes TO STDOUT WITH CSV HEADER;
COPY produto_participantes TO STDOUT WITH CSV HEADER;
COPY empresa_participantes TO STDOUT WITH CSV HEADER;
