import { NestFactory } from '@nestjs/core'
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify'
import { AppModule } from './app.module'


const bootstrap = async (port: number | string) => {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  )
  await app.listen(port)
  
  console.log(`\nApp listening on: http://127.0.0.1:${ port }`)
}

bootstrap(process.env.PORT ?? 3000).catch(console.error)
