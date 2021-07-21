# Instagrão - Serverless Challenge

O objetivo deste projeto é realizar uma POC (prova de conceito), utilizando Serverless, AWS e NodeJs. Neste projeto inicialmente foram defindas quatro funções a serem implementadas, no status atual do projeto a função InfoImages não encontra-se implementada.

### ExtractMetadata
 
Função que é é chamada quando um novo arquivo é carregado no S3. Ela
deverá extrair os metadados da imagem (dimensões, tamanho do arquivo) e armazenar no
DynamoDB.

### GetMetadata

Função que recebe a requisição de um endpoint criado pelo AWS API Gateway.
Ela irá receber o parâmetro s3objectkey e retornar os metadados armazenados no DynamoDB.

### GetImage
Função que recebe como parâmetro o s3objectkey e faz o download da imagem.

### InfoImages
Função que não recebe nenhum parâmetro e pesquisa os metadados salvos no
DynamoDB para retornar as seguintes informações:
-- Qual é a imagem que contém o maior tamanho?
-- Qual é a imagem que contém o menor tamanho?
-- Quais os tipos de imagem salvas no S3?
-- Qual a quantidade de cada tipo de imagem salva?

## Como utilizar

* Requisitos:
-- Possuir uma conta aws
-- Ter Node.Js instalado

### Passos

1. Instalar Serverless
``` npm install -g serverless```
2.  Clonar o repositório 
```git clone https://github.com/Rafael-Escobar/instagrao.git```
ou
```git clone git@github.com:Rafael-Escobar/instagrao.git```
3.  Instale as dependências
``` npm install ```
4. Definas as credenciais
``` serverless config credentiasl --provider aws --key YOURKEY --secret YOURSECRETKEY```

```bash
cat ~/.aws/credentials
[default]
aws_access_key_id=KKKKKKKKKKKK
aws_secret_access_key=00000000a00a0a0a00a0a0a0a0a0a
```
5. Realize o deploy da aplicação
```serverless deploy --bucket instagrao```

### Collection Postman

Para utilizar a colection defina em um ambiente as seguintes vairáveis:
- s3objectkey
- url