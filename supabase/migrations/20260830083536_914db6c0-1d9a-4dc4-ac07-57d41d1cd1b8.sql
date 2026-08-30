DROP POLICY IF EXISTS "scripts public read" ON public.scripts;

CREATE POLICY "scripts anon read approved"
  ON public.scripts FOR SELECT TO anon
  USING (approved);

CREATE POLICY "scripts auth read"
  ON public.scripts FOR SELECT TO authenticated
  USING (approved OR author_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
